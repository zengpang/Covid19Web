import { defineComponent, onMounted, ref } from "vue";
import s from './MainPage.module.scss'
import * as THREE from "three";
import * as d3 from "d3";
import chinaJson from '../../public/model/china.json'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
export const MainPage = defineComponent({

    setup: () => {
        const renderer = ref<THREE.WebGLRenderer>();
        const showMain = ref<HTMLDivElement>();
        const title = ref<HTMLDivElement>();
        const camera = ref<THREE.PerspectiveCamera>();
        const scene = new THREE.Scene();
        const hemiLight = ref<THREE.HemisphereLight>();
        const light = ref<THREE.PointLight>();
        const projection = d3.geoMercator().center([116.412318, 39.909843]).translate([10, -20]);
        const chinaMap = new THREE.Object3D();
        const provinces = new Array();
        const provinceIndex = ref(0);
        const controls = ref<OrbitControls>();
        const raycaster = new THREE.Raycaster();
        let selectedObject:any ;
        const mouse = new THREE.Vector2();
        const initRender = () => {
            renderer.value = new THREE.WebGLRenderer({ antialias: true });
            renderer.value.setSize(window.innerWidth, window.innerHeight);
            //告诉渲染器需要阴影效果 
            renderer.value.setClearColor('#1F2025', 1.0);
            showMain.value?.appendChild(renderer.value.domElement);
        }
        const initCamera = () => {
            camera.value = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
            camera.value.position.set(0, -150, 300);
            camera.value.lookAt(new THREE.Vector3(0, 0, 0));
        }
        const initLight = () => {
            hemiLight.value = new THREE.HemisphereLight('#80edff', '#75baff', 0.3);
            hemiLight.value.position.set(0, 50, 50)
            scene.add(hemiLight.value)
            scene.add(new THREE.AmbientLight(0x444444));
            light.value = new THREE.PointLight(0xffffff);
            light.value.position.set(0, 50, 50);
            //告诉平行光需要开启阴影投射
            light.value.castShadow = true;
            scene.add(light.value);
        }
        const drawMesh = (polygon: Array<any>, color: string) => {
            const shape = new THREE.Shape();
            polygon.forEach((row, i) => {
                const x = projection(row)![0];
                const y = projection(row)![1];
                if (i === 0) {
                    shape.moveTo(x, -y);
                }
                shape.lineTo(x, -y);
            });
            const geometry = new THREE.ExtrudeGeometry(shape, {
                depth:100,
                bevelEnabled: false
            });
            const material = new THREE.MeshBasicMaterial({
                color: color,
                transparent: true,
                opacity: 0.3
            })
            //  const material=selfMat;
            const resultMesh = new THREE.Mesh(geometry, material);
            resultMesh.scale.set(1, 1, 0.1);
            return resultMesh;
        }
        const lineDraw = (polygon: Array<any>, color: string) => {
            const lineGeometry = new THREE.BufferGeometry();
            const pointsArray = new Array();
            polygon.forEach((row) => {
                const x = projection(row)![0];
                const y = projection(row)![1];
                //创建三维点
                pointsArray.push(new THREE.Vector3(x, -y, 10));
            })
            lineGeometry.setFromPoints(pointsArray);
            //线性材质
            const lineMaterial = new THREE.LineBasicMaterial({
                color: color
            });
            return new THREE.Line(lineGeometry, lineMaterial);
        }
        const drawMap = (MapDate: Array<any>) => {
            //设置地图基础颜色
            const mapBaseColor = `#3597D4`;
            //遍历地图数组
            MapDate.forEach((feature) => {
                //省份
                const province = new THREE.Object3D();
                province.name = feature.properties.name;
               // province.name = `chinaMap${provinceIndex}`;
                const coordinates = feature.geometry.coordinates;
                if (feature.geometry.type === `MultiPolygon`) {

                    coordinates.forEach((coordinate: Array<any>) => {
                        coordinate.forEach((rows) => {
                            const mesh = drawMesh(rows, mapBaseColor);
                            const line = lineDraw(rows, mapBaseColor);
                            province.add(line);
                            province.add(mesh);
                        })
                    })
                }
                if (feature.geometry.type === `Polygon`) {
                    coordinates.forEach((coordinate: Array<any>) => {
                        const mesh = drawMesh(coordinate, mapBaseColor);
                        const line = lineDraw(coordinate, mapBaseColor);
                        province.add(line);
                        province.add(mesh);
                    })
                }
                provinces.push(province);
                chinaMap.add(province);
                provinceIndex.value++;
            })
            scene.add(chinaMap);
        }
        //获取疫情数据
        const getepidemicInfo = (provinceName: string) => {
            return new Promise((resolve, reject) => {
                const xhr = new XMLHttpRequest();
                const selectprovince = provinceName.replace(/省|自治区|维吾尔/g, ``);

                // let url = encodeURI(`http://localhost:8888/getCovidInfo?province=${selectprovince}`);
                const url = encodeURI(`http://1.13.165.4:8888/getCovidInfo?province=${selectprovince}`);
                xhr.open(`GET`, url, true);
                xhr.onload = function () {
                    resolve(JSON.parse(xhr.responseText));
                };
                xhr.onerror = function () {
                    reject(`出现异常`);
                };
                xhr.send();
            });
        }
        //射线检测事件
        const rayCastEvent = () => {
            if (selectedObject) {
                selectedObject.material.opacity = 0.3;   
                selectedObject = null;
               
            }
            if (raycaster) {

                const intersects = raycaster.intersectObjects(provinces, true);
                if (intersects.length > 0) {

                    const res = intersects.filter(function (res) {
                        return res && res.object;
                    })[intersects.length - 1];

                    if (res && res.object) {
                        selectedObject = res.object;
                        selectedObject.material.opacity = 1;
                    }
                }
            }
        }
        const initControls = () => {
            controls.value = new OrbitControls(camera.value!, renderer.value!.domElement);
            // 使动画循环使用时阻尼或自转 意思是否有惯性
            controls.value.enableDamping = true;
            //动态阻尼系数 就是鼠标拖拽旋转灵敏度
            //controls.dampingFactor = 0.25;
            //是否可以缩放
            controls.value.enableZoom = true;
            //是否自动旋转
            controls.value.autoRotate = true;
            controls.value.autoRotateSpeed = 0.5;
            //设置相机距离原点的最近距离
            controls.value.minDistance = 1;
            //设置相机距离原点的最远距离
            controls.value.maxDistance = 400;
            //是否开启右键拖拽
            controls.value.enablePan = true;
            //限制相机水平角度最小值
            controls.value.minAzimuthAngle = -Math.PI * (50 / 180);
            //限制相机水平角度最大值
            controls.value.maxAzimuthAngle = Math.PI * (50 / 180);
            //限制相机垂直角度最小值
            controls.value.minPolarAngle = -Math.PI * (100 / 180);
            //限制相机垂直角度最大值
            controls.value.maxPolarAngle = Math.PI * 1;
        }
        const render = () => {
            if (raycaster) {

                raycaster.setFromCamera(mouse, camera.value!);
            }
            renderer.value!.render(scene, camera.value!);
        }
        const mapClick = () => {
            if (selectedObject) {
                
                let selectprovinceName = selectedObject.parent.name;
                console.log(selectprovinceName);
                title.value!.innerText = selectprovinceName;
                getepidemicInfo(selectprovinceName).then((covidInfo: any) => {

                    title.value!.innerText = `${selectprovinceName}。共计确诊数量：${covidInfo.total.confirm}。共计死亡数量：${covidInfo.total.dead}。共计治愈数量：${covidInfo.total.heal}`;
                });


            }
        }
        
        const initMap = () => {
            const loader = new THREE.FileLoader();
            loader.load('model/china.json', (data: any) => {
                const MapStr = JSON.parse(data);
               
                const MapDate = MapStr.features;
                drawMap(MapDate);
            });
        }
        const animate = () => {
            //更新控制器
            render();
            requestAnimationFrame(animate);
        }
        const onMouseMove = (event: any) => {
            const { top, left, width, height } = showMain.value!.getBoundingClientRect();
            let clientX = event.clientX - left;
            let clientY = event.clientY - top;
            mouse.x = (clientX / width) * 2 - 1;
            mouse.y = -(clientY / height) * 2 + 1;
        }
        const onWindowResize = () => {
            camera.value!.aspect = window.innerWidth / window.innerHeight;
            camera.value!.updateProjectionMatrix();
            render();
            renderer.value!.setSize(window.innerWidth, window.innerHeight);
        }
        onMounted(() => {
            initRender();

            initCamera();
            initLight();
            initMap();
            initControls();
            animate();
            document.addEventListener(`mousemove`, onMouseMove, false);
            document.addEventListener(`pointermove`, rayCastEvent);
            document.addEventListener(`click`, mapClick);
            window.onresize = onWindowResize;
        });
        return () => (
            <div class={s.mainPage} >
                <header>
                    <h1 ref={title}>城市名</h1>
                </header>
                <main ref={showMain}>

                </main>
            </div>
        )
    }
})